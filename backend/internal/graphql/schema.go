package graphql

import (
	"cloud-clips/internal/models"
	"cloud-clips/internal/storage"
	"github.com/graphql-go/graphql"
)

func NewSchema(storage *storage.MemoryStorage) (graphql.Schema, error) {
	// Simple user type
	userType := graphql.NewObject(graphql.ObjectConfig{
		Name: "User",
		Fields: graphql.Fields{
			"id":    &graphql.Field{Type: graphql.String},
			"email": &graphql.Field{Type: graphql.String},
			"name":  &graphql.Field{Type: graphql.String},
			"role":  &graphql.Field{Type: graphql.String},
		},
	})

	// Simple barber profile type
	barberProfileType := graphql.NewObject(graphql.ObjectConfig{
		Name: "BarberProfile",
		Fields: graphql.Fields{
			"id":           &graphql.Field{Type: graphql.String},
			"businessName": &graphql.Field{Type: graphql.String},
			"bio":          &graphql.Field{Type: graphql.String},
			"rating":       &graphql.Field{Type: graphql.Float},
			"totalReviews": &graphql.Field{Type: graphql.Int},
			"isVerified":   &graphql.Field{Type: graphql.Boolean},
			"user": &graphql.Field{
				Type: userType,
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					if profile, ok := p.Source.(*models.BarberProfile); ok {
						return storage.Users[profile.UserID], nil
					}
					return nil, nil
				},
			},
		},
	})

	// Simple appointment type
	appointmentType := graphql.NewObject(graphql.ObjectConfig{
		Name: "Appointment",
		Fields: graphql.Fields{
			"id":           &graphql.Field{Type: graphql.String},
			"status":       &graphql.Field{Type: graphql.String},
			"serviceType":  &graphql.Field{Type: graphql.String},
			"scheduledFor": &graphql.Field{Type: graphql.String},
			"price":        &graphql.Field{Type: graphql.Float},
			"client": &graphql.Field{
				Type: userType,
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					if appointment, ok := p.Source.(*models.Appointment); ok {
						return storage.Users[appointment.ClientID], nil
					}
					return nil, nil
				},
			},
			"barber": &graphql.Field{
				Type: userType,
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					if appointment, ok := p.Source.(*models.Appointment); ok {
						return storage.Users[appointment.BarberID], nil
					}
					return nil, nil
				},
			},
		},
	})

	// Root query
	rootQuery := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"users": &graphql.Field{
				Type: graphql.NewList(userType),
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					var users []*models.User
					for _, user := range storage.Users {
						users = append(users, user)
					}
					return users, nil
				},
			},
			"user": &graphql.Field{
				Type: userType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					idStr := p.Args["id"].(string)
					for id, user := range storage.Users {
						if id.String() == idStr {
							return user, nil
						}
					}
					return nil, nil
				},
			},
			"barbers": &graphql.Field{
				Type: graphql.NewList(barberProfileType),
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					var profiles []*models.BarberProfile
					for _, profile := range storage.BarberProfiles {
						if user, exists := storage.Users[profile.UserID]; exists && user.Role == models.RoleBarber {
							profiles = append(profiles, profile)
						}
					}
					return profiles, nil
				},
			},
			"barber": &graphql.Field{
				Type: barberProfileType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					idStr := p.Args["id"].(string)
					for id, profile := range storage.BarberProfiles {
						if id.String() == idStr {
							return profile, nil
						}
					}
					return nil, nil
				},
			},
			"appointments": &graphql.Field{
				Type: graphql.NewList(appointmentType),
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					var appointments []*models.Appointment
					for _, appointment := range storage.Appointments {
						appointments = append(appointments, appointment)
					}
					return appointments, nil
				},
			},
			"appointment": &graphql.Field{
				Type: appointmentType,
				Args: graphql.FieldConfigArgument{
					"id": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					idStr := p.Args["id"].(string)
					for id, appointment := range storage.Appointments {
						if id.String() == idStr {
							return appointment, nil
						}
					}
					return nil, nil
				},
			},
		},
	})

	// Root mutation
	rootMutation := graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"createUser": &graphql.Field{
				Type: userType,
				Args: graphql.FieldConfigArgument{
					"email": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"name":  &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"role":  &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: func(p graphql.ResolveParams) (interface{}, error) {
					// TODO: Implement user creation logic
					return nil, nil
				},
			},
		},
	})

	return graphql.NewSchema(graphql.SchemaConfig{
		Query:    rootQuery,
		Mutation: rootMutation,
	})
}
